using Decoartes3D.API.Configuration;
using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Orders;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Decoartes3D.API.Controllers;

[Route("api/orders")]
public class OrdersController(IOrderService orderService) : ApiControllerBase
{
    /// <summary>
    /// Crea un pedido. Admite compra como invitado; si hay sesión, el pedido queda asociado al usuario.
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType<OrderResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await orderService.CreateAsync(request, CurrentUserId, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : Failure(result);
    }

    /// <summary>Listado paginado para el panel de administración.</summary>
    [HttpGet]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<PagedResult<OrderSummaryResponse>> GetPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? userId = null,
        [FromQuery] OrderStatus? status = null,
        CancellationToken cancellationToken = default) =>
        await orderService.GetPagedAsync(pageNumber, pageSize, userId, status, cancellationToken);

    /// <summary>Historial de pedidos del usuario autenticado.</summary>
    [HttpGet("mine")]
    [Authorize]
    public async Task<IEnumerable<OrderSummaryResponse>> GetMine(CancellationToken cancellationToken) =>
        await orderService.GetByUserIdAsync(CurrentUserId!.Value, cancellationToken);

    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType<OrderResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await orderService.GetByIdAsync(id, cancellationToken);
        // Un cliente que pide un pedido ajeno recibe 404, no 403: no se revela que existe.
        if (result.IsSuccess && !IsAdmin && result.Value.UserId != CurrentUserId)
            return NotFound();
        return FromResult(result);
    }

    /// <summary>
    /// Seguimiento público de un pedido: requiere número de pedido y el email de envío.
    /// </summary>
    [HttpGet("track")]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [AllowAnonymous]
    [ProducesResponseType<OrderResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderResponse>> Track([FromQuery] string orderNumber, [FromQuery] string email, CancellationToken cancellationToken)
    {
        var result = await orderService.GetByOrderNumberAsync(orderNumber, cancellationToken);
        if (result.IsSuccess && !string.Equals(result.Value.ShippingEmail, email.Trim(), StringComparison.OrdinalIgnoreCase))
            return Problem(detail: "Pedido no encontrado.", statusCode: StatusCodes.Status404NotFound);
        return FromResult(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType<OrderResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(int id, UpdateOrderStatusRequest request, CancellationToken cancellationToken) =>
        FromResult(await orderService.UpdateStatusAsync(id, request, cancellationToken));

    /// <summary>
    /// Cancela un pedido y repone el stock. El cliente solo puede cancelar sus pedidos pendientes.
    /// </summary>
    [HttpPost("{id:int}/cancel")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        if (!IsAdmin)
        {
            var order = await orderService.GetByIdAsync(id, cancellationToken);
            if (order.IsFailure || order.Value.UserId != CurrentUserId)
                return Problem(detail: "Pedido no encontrado.", statusCode: StatusCodes.Status404NotFound);
            if (order.Value.Status != nameof(OrderStatus.Pending))
                return Problem(detail: "Solo puedes cancelar pedidos pendientes. Contacta con nosotros.", statusCode: StatusCodes.Status409Conflict);
        }

        return FromResult(await orderService.CancelAsync(id, cancellationToken));
    }
}
