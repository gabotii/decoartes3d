namespace Decoartes3D.Application.DTOs.Orders;

public record CreateOrderItemRequest(int ProductId, int Quantity);

public record CreateOrderRequest(
    string ShippingFirstName,
    string ShippingLastName,
    string ShippingEmail,
    string? ShippingPhone,
    string ShippingAddress,
    string ShippingCity,
    string ShippingState,
    string ShippingPostalCode,
    string ShippingCountry,
    string? Notes,
    IEnumerable<CreateOrderItemRequest> Items
);
