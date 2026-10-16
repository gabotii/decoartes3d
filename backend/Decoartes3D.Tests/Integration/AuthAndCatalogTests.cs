using System.Net;
using System.Net.Http.Json;
using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Auth;
using Decoartes3D.Application.DTOs.Categories;
using Decoartes3D.Application.DTOs.Products;

namespace Decoartes3D.Tests.Integration;

public class AuthAndCatalogTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly System.Text.Json.JsonSerializerOptions Json = ApiFactory.Json;

    [Fact]
    public async Task Public_catalog_lists_seeded_active_products()
    {
        var client = factory.CreateClient();

        var page = await client.GetFromJsonAsync<PagedResult<ProductSummaryResponse>>("/api/products?pageSize=5", Json);

        Assert.NotNull(page);
        Assert.Equal(8, page.TotalCount);
        Assert.Equal(5, page.Items.Count());
        Assert.Equal(2, page.TotalPages);
        Assert.All(page.Items, p => Assert.True(p.IsActive));
    }

    [Fact]
    public async Task Product_can_be_fetched_by_slug_with_details()
    {
        var client = factory.CreateClient();

        var product = await client.GetFromJsonAsync<ProductDetailResponse>("/api/products/slug/lampara-ondas", Json);

        Assert.NotNull(product);
        Assert.Equal("Lámpara Ondas", product.Name);
        Assert.Equal("Lámparas", product.CategoryName);
        Assert.Equal("PLA", product.MaterialName);
    }

    [Fact]
    public async Task Register_then_login_then_me_returns_the_same_user()
    {
        var client = factory.CreateClient();
        var email = $"Nuevo-{Guid.NewGuid():N}@Test.local";

        var register = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "Segura123", "Mario", "Ruiz", "600 000 000"), Json);
        Assert.Equal(HttpStatusCode.OK, register.StatusCode);

        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Segura123"), Json);
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>(Json);
        Assert.NotNull(auth);
        Assert.Equal(email.ToLowerInvariant(), auth.Email);
        Assert.Equal("Customer", auth.Role);

        client.DefaultRequestHeaders.Authorization = new("Bearer", auth.Token);
        var me = await client.GetFromJsonAsync<Dictionary<string, object>>("/api/auth/me", Json);
        Assert.Equal(auth.UserId.ToString(), me!["userId"].ToString());
        Assert.Equal("Customer", me["role"].ToString());
    }

    [Fact]
    public async Task Registering_an_existing_email_returns_conflict()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(ApiFactory.AdminEmail.ToUpperInvariant(), "Otra12345", "X", "Y", null), Json);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_unauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(ApiFactory.AdminEmail, "Incorrecta1"), Json);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Customer_cannot_use_admin_endpoints()
    {
        var (client, _) = await factory.CreateCustomerClientAsync();

        var response = await client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest("Hackeo", null, null), Json);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_creates_products_with_unique_accent_free_slugs()
    {
        var client = await factory.CreateAdminClientAsync();
        var request = new CreateProductRequest("Búho Geométrico", null, "Figura", 24.95m, 3, null,
            null, null, null, null, true, false, 0, CategoryId: 3, MaterialId: 1);

        var first = await client.PostAsJsonAsync("/api/products", request, Json);
        var second = await client.PostAsJsonAsync("/api/products", request, Json);

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal("buho-geometrico", (await first.Content.ReadFromJsonAsync<ProductDetailResponse>(Json))!.Slug);
        Assert.Equal("buho-geometrico-2", (await second.Content.ReadFromJsonAsync<ProductDetailResponse>(Json))!.Slug);
    }

    [Fact]
    public async Task Creating_a_product_in_a_missing_category_is_rejected()
    {
        var client = await factory.CreateAdminClientAsync();
        var request = new CreateProductRequest("Huérfano", null, null, 10m, 1, null,
            null, null, null, null, true, false, 0, CategoryId: 999, MaterialId: null);

        var response = await client.PostAsJsonAsync("/api/products", request, Json);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Deleting_a_category_with_products_returns_conflict()
    {
        var client = await factory.CreateAdminClientAsync();

        var categories = await client.GetFromJsonAsync<List<CategoryResponse>>("/api/categories/all", Json);
        var withProducts = categories!.First(c => c.ProductCount > 0);
        var response = await client.DeleteAsync($"/api/categories/{withProducts.Id}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Inactive_products_are_hidden_from_the_public_catalog()
    {
        var admin = await factory.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/products", new CreateProductRequest("Prototipo Oculto", null, null, 5m, 1, null,
            null, null, null, null, IsActive: false, false, 0, CategoryId: 1, MaterialId: null), Json);
        var product = (await created.Content.ReadFromJsonAsync<ProductDetailResponse>(Json))!;

        var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/products/{product.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync($"/api/products/slug/{product.Slug}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"/api/products/{product.Id}")).StatusCode);
    }
}
