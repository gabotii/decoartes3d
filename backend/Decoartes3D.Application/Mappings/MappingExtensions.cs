using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Categories;
using Decoartes3D.Application.DTOs.Materials;
using Decoartes3D.Application.DTOs.Orders;
using Decoartes3D.Application.DTOs.Products;
using Decoartes3D.Domain.Entities;

namespace Decoartes3D.Application.Mappings;

public static class MappingExtensions
{
    public static CategoryResponse ToResponse(this Category category) => new(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.ImageUrl,
        category.IsActive,
        category.SortOrder,
        category.Products.Count,
        category.CreatedAt);

    public static MaterialResponse ToResponse(this Material material) => new(
        material.Id,
        material.Name,
        material.Description,
        material.ColorHex,
        material.IsActive,
        material.CreatedAt);

    public static ProductSummaryResponse ToSummaryResponse(this Product product) => new(
        product.Id,
        product.Name,
        product.Slug,
        product.ShortDescription,
        product.Price,
        product.StockQuantity,
        product.MainImageUrl,
        product.IsActive,
        product.IsFeatured,
        product.Category?.Name ?? string.Empty,
        product.CategoryId,
        product.Material?.Name,
        product.CreatedAt);

    public static ProductDetailResponse ToDetailResponse(this Product product) => new(
        product.Id,
        product.Name,
        product.Slug,
        product.Description,
        product.ShortDescription,
        product.Price,
        product.StockQuantity,
        product.MainImageUrl,
        product.Width,
        product.Height,
        product.Depth,
        product.WeightGrams,
        product.IsActive,
        product.IsFeatured,
        product.SortOrder,
        product.CategoryId,
        product.Category?.Name ?? string.Empty,
        product.MaterialId,
        product.Material?.Name,
        product.Material?.ColorHex,
        product.Images
            .OrderBy(i => i.SortOrder)
            .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder))
            .ToList(),
        product.CreatedAt,
        product.UpdatedAt);

    public static OrderItemResponse ToResponse(this OrderItem item) => new(
        item.Id,
        item.ProductId,
        item.ProductNameSnapshot,
        item.Product?.MainImageUrl,
        item.Quantity,
        item.UnitPrice,
        item.Subtotal);

    public static OrderResponse ToResponse(this Order order) => new(
        order.Id,
        order.OrderNumber,
        order.Status.ToString(),
        order.Total,
        order.Notes,
        order.ShippingFirstName,
        order.ShippingLastName,
        order.ShippingEmail,
        order.ShippingPhone,
        order.ShippingAddress,
        order.ShippingCity,
        order.ShippingState,
        order.ShippingPostalCode,
        order.ShippingCountry,
        order.UserId,
        order.User?.FullName,
        order.Items.Select(i => i.ToResponse()).ToList(),
        order.CreatedAt,
        order.UpdatedAt);

    public static OrderSummaryResponse ToSummaryResponse(this Order order) => new(
        order.Id,
        order.OrderNumber,
        order.Status.ToString(),
        order.Total,
        order.ShippingEmail,
        order.User?.FullName ?? $"{order.ShippingFirstName} {order.ShippingLastName}".Trim(),
        order.Items.Sum(i => i.Quantity),
        order.CreatedAt);

    public static PagedResult<TResult> ToPagedResult<TSource, TResult>(
        this IEnumerable<TSource> items,
        int totalCount,
        int pageNumber,
        int pageSize,
        Func<TSource, TResult> map) => new()
    {
        Items = items.Select(map).ToList(),
        TotalCount = totalCount,
        PageNumber = pageNumber,
        PageSize = pageSize
    };
}
