using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Orders;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Enums;

namespace Decoartes3D.Application.Interfaces;

public interface IOrderService
{
    Task<PagedResult<OrderSummaryResponse>> GetPagedAsync(int pageNumber, int pageSize, int? userId = null, OrderStatus? status = null, CancellationToken cancellationToken = default);
    Task<Result<OrderResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<OrderResponse>> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<OrderSummaryResponse>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<Result<OrderResponse>> CreateAsync(CreateOrderRequest request, int? userId = null, CancellationToken cancellationToken = default);
    Task<Result<OrderResponse>> UpdateStatusAsync(int id, UpdateOrderStatusRequest request, CancellationToken cancellationToken = default);
    Task<Result> CancelAsync(int id, CancellationToken cancellationToken = default);
}
