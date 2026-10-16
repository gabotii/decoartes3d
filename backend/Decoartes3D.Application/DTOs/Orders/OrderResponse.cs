namespace Decoartes3D.Application.DTOs.Orders;

public record OrderItemResponse(
    int Id,
    int ProductId,
    string ProductName,
    string? ProductImageUrl,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record OrderResponse(
    int Id,
    string OrderNumber,
    string Status,
    decimal Total,
    string? Notes,
    string ShippingFirstName,
    string ShippingLastName,
    string ShippingEmail,
    string? ShippingPhone,
    string ShippingAddress,
    string ShippingCity,
    string ShippingState,
    string ShippingPostalCode,
    string ShippingCountry,
    int? UserId,
    string? CustomerName,
    IEnumerable<OrderItemResponse> Items,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record OrderSummaryResponse(
    int Id,
    string OrderNumber,
    string Status,
    decimal Total,
    string ShippingEmail,
    string CustomerName,
    int ItemCount,
    DateTime CreatedAt
);
