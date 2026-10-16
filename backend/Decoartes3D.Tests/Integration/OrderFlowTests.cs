using System.Net;
using System.Net.Http.Json;
using Decoartes3D.Application.DTOs.Orders;
using Decoartes3D.Application.DTOs.Products;
using Decoartes3D.Domain.Enums;

namespace Decoartes3D.Tests.Integration;

public class OrderFlowTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = ApiFactory.Json;

    private static CreateOrderRequest Order(params CreateOrderItemRequest[] items) => new(
        "Ana", "García", "ana@example.com", null, "Calle Mayor 1", "Madrid", "Madrid", "28001", "España", null, items);

    private async Task<ProductDetailResponse> GetProductAsync(HttpClient client, string slug) =>
        (await client.GetFromJsonAsync<ProductDetailResponse>($"/api/products/slug/{slug}", Json))!;

    [Fact]
    public async Task Guest_order_uses_catalog_prices_merges_lines_and_decrements_stock()
    {
        var client = factory.CreateClient();
        var product = await GetProductAsync(client, "maceta-geometrica-facetada");

        var response = await client.PostAsJsonAsync("/api/orders",
            Order(new CreateOrderItemRequest(product.Id, 2), new(product.Id, 1)), Json);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = (await response.Content.ReadFromJsonAsync<OrderResponse>(Json))!;
        Assert.Matches(@"^DA-\d{6}-[2-9A-HJ-NP-Z]{6}$", order.OrderNumber);
        Assert.Equal("Pending", order.Status);
        Assert.Null(order.UserId);
        var line = Assert.Single(order.Items);
        Assert.Equal(3, line.Quantity);
        Assert.Equal(product.Price, line.UnitPrice);
        Assert.Equal(product.Price * 3, order.Total);

        var after = await GetProductAsync(client, product.Slug);
        Assert.Equal(product.StockQuantity - 3, after.StockQuantity);
    }

    [Fact]
    public async Task Order_exceeding_stock_is_rejected_without_touching_any_stock()
    {
        var client = factory.CreateClient();
        var available = await GetProductAsync(client, "busto-clasico-minimal");
        var scarce = await GetProductAsync(client, "relieve-montanas");

        var response = await client.PostAsJsonAsync("/api/orders",
            Order(new CreateOrderItemRequest(available.Id, 1), new(scarce.Id, scarce.StockQuantity + 1)), Json);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(available.StockQuantity, (await GetProductAsync(client, available.Slug)).StockQuantity);
        Assert.Equal(scarce.StockQuantity, (await GetProductAsync(client, scarce.Slug)).StockQuantity);
    }

    [Fact]
    public async Task Invalid_order_payload_returns_field_errors()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/orders",
            Order(new CreateOrderItemRequest(1, 0)) with { ShippingEmail = "no-es-email" }, Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("shippingEmail", body);
        Assert.Contains("items[0].quantity", body);
    }

    [Fact]
    public async Task Admin_status_flow_enforces_transitions_and_cancel_restores_stock()
    {
        var admin = await factory.CreateAdminClientAsync();
        var product = await GetProductAsync(admin, "lampara-luna-texturizada");
        var created = await admin.PostAsJsonAsync("/api/orders", Order(new CreateOrderItemRequest(product.Id, 2)), Json);
        var order = (await created.Content.ReadFromJsonAsync<OrderResponse>(Json))!;

        var skip = await admin.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new UpdateOrderStatusRequest(OrderStatus.Shipped), Json);
        Assert.Equal(HttpStatusCode.Conflict, skip.StatusCode);

        var confirm = await admin.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new UpdateOrderStatusRequest(OrderStatus.Confirmed), Json);
        Assert.Equal("Confirmed", (await confirm.Content.ReadFromJsonAsync<OrderResponse>(Json))!.Status);

        Assert.Equal(product.StockQuantity - 2, (await GetProductAsync(admin, product.Slug)).StockQuantity);

        var cancel = await admin.PostAsync($"/api/orders/{order.Id}/cancel", null);
        Assert.Equal(HttpStatusCode.NoContent, cancel.StatusCode);
        Assert.Equal(product.StockQuantity, (await GetProductAsync(admin, product.Slug)).StockQuantity);

        var reopen = await admin.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new UpdateOrderStatusRequest(OrderStatus.Pending), Json);
        Assert.Equal(HttpStatusCode.Conflict, reopen.StatusCode);
    }

    [Fact]
    public async Task Customer_sees_only_own_orders()
    {
        var (owner, ownerAuth) = await factory.CreateCustomerClientAsync();
        var (other, _) = await factory.CreateCustomerClientAsync();
        var product = await GetProductAsync(owner, "panel-hexagonal-modular");

        var created = await owner.PostAsJsonAsync("/api/orders", Order(new CreateOrderItemRequest(product.Id, 1)), Json);
        var order = (await created.Content.ReadFromJsonAsync<OrderResponse>(Json))!;
        Assert.Equal(ownerAuth.UserId, order.UserId);

        var mine = await owner.GetFromJsonAsync<List<OrderSummaryResponse>>("/api/orders/mine", Json);
        Assert.Contains(mine!, o => o.Id == order.Id);

        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/api/orders/{order.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsync($"/api/orders/{order.Id}/cancel", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await other.GetAsync("/api/orders")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await owner.PostAsync($"/api/orders/{order.Id}/cancel", null)).StatusCode);
    }

    [Fact]
    public async Task Tracking_requires_the_matching_shipping_email()
    {
        var client = factory.CreateClient();
        var product = await GetProductAsync(client, "escultura-nudo-infinito");
        var created = await client.PostAsJsonAsync("/api/orders", Order(new CreateOrderItemRequest(product.Id, 1)), Json);
        var order = (await created.Content.ReadFromJsonAsync<OrderResponse>(Json))!;

        var wrong = await client.GetAsync($"/api/orders/track?orderNumber={order.OrderNumber}&email=otro@example.com");
        var right = await client.GetAsync($"/api/orders/track?orderNumber={order.OrderNumber.ToLowerInvariant()}&email=ANA@example.com");

        Assert.Equal(HttpStatusCode.NotFound, wrong.StatusCode);
        Assert.Equal(HttpStatusCode.OK, right.StatusCode);
    }
}
