using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Orders;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Application.Mappings;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Enums;
using Decoartes3D.Domain.Interfaces;
using Decoartes3D.Domain.Interfaces.Repositories;

namespace Decoartes3D.Application.Services;

public class OrderService(
    IOrderRepository orderRepository,
    IProductRepository productRepository,
    IUnitOfWork unitOfWork) : IOrderService
{
    private const string NotFoundMessage = "Pedido no encontrado.";

    public async Task<PagedResult<OrderSummaryResponse>> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? userId = null,
        OrderStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var (page, size) = Pagination.Normalize(pageNumber, pageSize);
        var (items, totalCount) = await orderRepository.GetPagedAsync(page, size, userId, status, cancellationToken);
        return items.ToPagedResult(totalCount, page, size, o => o.ToSummaryResponse());
    }

    public async Task<Result<OrderResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetWithDetailsAsync(id, cancellationToken);
        return order is null
            ? Result.NotFound<OrderResponse>(NotFoundMessage)
            : Result.Success(order.ToResponse());
    }

    public async Task<Result<OrderResponse>> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByOrderNumberAsync(orderNumber.Trim().ToUpperInvariant(), cancellationToken);
        return order is null
            ? Result.NotFound<OrderResponse>(NotFoundMessage)
            : Result.Success(order.ToResponse());
    }

    public async Task<IEnumerable<OrderSummaryResponse>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        var orders = await orderRepository.GetByUserIdAsync(userId, cancellationToken);
        return orders.Select(o => o.ToSummaryResponse()).ToList();
    }

    public async Task<Result<OrderResponse>> CreateAsync(CreateOrderRequest request, int? userId = null, CancellationToken cancellationToken = default)
    {
        // Agrupa líneas repetidas del mismo producto (p. ej. añadido dos veces al carrito).
        var requestedItems = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => (ProductId: g.Key, Quantity: g.Sum(i => i.Quantity)))
            .ToList();

        if (requestedItems.Count == 0)
            return Result.Failure<OrderResponse>("El pedido debe contener al menos un producto.");

        var productIds = requestedItems.Select(i => i.ProductId).ToList();
        var products = (await productRepository.FindAsync(p => productIds.Contains(p.Id), cancellationToken))
            .ToDictionary(p => p.Id);

        var order = new Order
        {
            OrderNumber = await orderRepository.GenerateOrderNumberAsync(cancellationToken),
            Status = OrderStatus.Pending,
            Notes = request.Notes?.Trim(),
            ShippingFirstName = request.ShippingFirstName.Trim(),
            ShippingLastName = request.ShippingLastName.Trim(),
            ShippingEmail = request.ShippingEmail.Trim().ToLowerInvariant(),
            ShippingPhone = request.ShippingPhone?.Trim(),
            ShippingAddress = request.ShippingAddress.Trim(),
            ShippingCity = request.ShippingCity.Trim(),
            ShippingState = request.ShippingState.Trim(),
            ShippingPostalCode = request.ShippingPostalCode.Trim(),
            ShippingCountry = request.ShippingCountry.Trim(),
            UserId = userId
        };

        foreach (var (productId, quantity) in requestedItems)
        {
            if (!products.TryGetValue(productId, out var product) || !product.IsActive)
                return Result.Failure<OrderResponse>($"El producto {productId} no existe o no está disponible.");

            if (product.StockQuantity < quantity)
                return Result.Conflict<OrderResponse>(
                    $"Stock insuficiente para '{product.Name}': disponibles {product.StockQuantity}, solicitados {quantity}.");

            // El precio siempre sale del catálogo, nunca del cliente.
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity
            });
        }

        // Solo se descuenta stock cuando todas las líneas son válidas.
        foreach (var (productId, quantity) in requestedItems)
            products[productId].StockQuantity -= quantity;

        order.Total = order.Items.Sum(i => i.Subtotal);

        await orderRepository.AddAsync(order, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(order.Id, cancellationToken);
    }

    public async Task<Result<OrderResponse>> UpdateStatusAsync(int id, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetWithDetailsAsync(id, cancellationToken);
        if (order is null)
            return Result.NotFound<OrderResponse>(NotFoundMessage);

        if (order.Status == request.Status)
            return Result.Success(order.ToResponse());

        if (!order.CanTransitionTo(request.Status))
            return Result.Conflict<OrderResponse>($"No se puede pasar un pedido de {order.Status} a {request.Status}.");

        if (request.Status == OrderStatus.Cancelled)
            RestoreStock(order);

        order.Status = request.Status;

        await orderRepository.UpdateAsync(order, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(order.ToResponse());
    }

    public async Task<Result> CancelAsync(int id, CancellationToken cancellationToken = default)
    {
        var result = await UpdateStatusAsync(id, new UpdateOrderStatusRequest(OrderStatus.Cancelled), cancellationToken);
        return result.IsSuccess ? Result.Success() : Result.Failure(result.Error!, result.ErrorType);
    }

    private static void RestoreStock(Order order)
    {
        foreach (var item in order.Items)
            item.Product.StockQuantity += item.Quantity;
    }
}
