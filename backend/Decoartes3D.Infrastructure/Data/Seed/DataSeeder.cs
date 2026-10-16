using Decoartes3D.Application.Interfaces;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Decoartes3D.Infrastructure.Data.Seed;

public class SeedSettings
{
    public const string SectionName = "Seed";

    public string? AdminEmail { get; init; }
    public string? AdminPassword { get; init; }
    public bool SampleCatalog { get; init; }
}

/// <summary>
/// Idempotente: solo inserta lo que falta. El catálogo de ejemplo solo se crea si no hay categorías.
/// </summary>
public class DataSeeder(
    AppDbContext context,
    IPasswordHasher passwordHasher,
    IOptions<SeedSettings> options,
    ILogger<DataSeeder> logger)
{
    private readonly SeedSettings _settings = options.Value;

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedAdminAsync(cancellationToken);

        if (_settings.SampleCatalog && !await context.Categories.AnyAsync(cancellationToken))
            await SeedSampleCatalogAsync(cancellationToken);
    }

    private async Task SeedAdminAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.AdminEmail) || string.IsNullOrWhiteSpace(_settings.AdminPassword))
        {
            logger.LogWarning("Seed:AdminEmail / Seed:AdminPassword no configurados: no se crea usuario administrador.");
            return;
        }

        var email = _settings.AdminEmail.Trim().ToLowerInvariant();
        if (await context.Users.AnyAsync(u => u.Email == email, cancellationToken))
            return;

        context.Users.Add(new User
        {
            Email = email,
            PasswordHash = passwordHasher.Hash(_settings.AdminPassword),
            FirstName = "Administrador",
            LastName = "Decoartes3D",
            Role = UserRole.Admin,
            IsActive = true
        });

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Usuario administrador {Email} creado.", email);
    }

    private async Task SeedSampleCatalogAsync(CancellationToken cancellationToken)
    {
        var materials = new Dictionary<string, Material>
        {
            ["PLA"] = new() { Name = "PLA", Description = "Bioplástico de acabado mate, ideal para piezas decorativas.", ColorHex = "#F5F5F0" },
            ["PETG"] = new() { Name = "PETG", Description = "Resistente y con ligero brillo, apto para exterior.", ColorHex = "#D8E4EC" },
            ["Resina"] = new() { Name = "Resina", Description = "Máximo nivel de detalle para figuras y miniaturas.", ColorHex = "#E8E0D0" },
            ["Madera"] = new() { Name = "PLA Madera", Description = "PLA con fibra de madera: tacto y aspecto natural.", ColorHex = "#A0764B" }
        };

        var categories = new Dictionary<string, Category>
        {
            ["jarrones"] = new() { Name = "Jarrones y macetas", Slug = "jarrones-y-macetas", Description = "Jarrones, macetas y centros de mesa.", SortOrder = 1 },
            ["lamparas"] = new() { Name = "Lámparas", Slug = "lamparas", Description = "Lámparas y pantallas con diseños paramétricos.", SortOrder = 2 },
            ["figuras"] = new() { Name = "Figuras y esculturas", Slug = "figuras-y-esculturas", Description = "Esculturas, bustos y figuras decorativas.", SortOrder = 3 },
            ["pared"] = new() { Name = "Decoración de pared", Slug = "decoracion-de-pared", Description = "Paneles, relieves y arte mural.", SortOrder = 4 }
        };

        Product P(string name, string slug, string summary, decimal price, int stock, string category, string material,
            decimal w, decimal h, decimal d, decimal grams, bool featured, int sort) => new()
        {
            Name = name,
            Slug = slug,
            ShortDescription = summary,
            Description = summary + " Impreso bajo pedido en nuestro taller y acabado a mano.",
            Price = price,
            StockQuantity = stock,
            Category = categories[category],
            Material = materials[material],
            Width = w,
            Height = h,
            Depth = d,
            WeightGrams = grams,
            IsFeatured = featured,
            SortOrder = sort
        };

        var products = new[]
        {
            P("Jarrón Espiral Voronoi", "jarron-espiral-voronoi", "Jarrón de estructura orgánica Voronoi con giro helicoidal.", 34.90m, 12, "jarrones", "PLA", 12, 25, 12, 180, true, 1),
            P("Maceta Geométrica Facetada", "maceta-geometrica-facetada", "Maceta low-poly con plato de drenaje integrado.", 19.50m, 25, "jarrones", "PETG", 14, 13, 14, 150, false, 2),
            P("Lámpara Ondas", "lampara-ondas", "Pantalla de lámpara con ondas que proyectan sombras suaves.", 59.00m, 6, "lamparas", "PLA", 20, 30, 20, 320, true, 1),
            P("Lámpara Luna Texturizada", "lampara-luna-texturizada", "Lámpara esférica con relieve lunar fiel a la topografía real.", 45.00m, 8, "lamparas", "PLA", 15, 15, 15, 260, true, 2),
            P("Busto Clásico Minimal", "busto-clasico-minimal", "Reinterpretación minimalista de un busto griego.", 39.90m, 10, "figuras", "Resina", 10, 18, 9, 210, true, 1),
            P("Escultura Nudo Infinito", "escultura-nudo-infinito", "Escultura matemática inspirada en la banda de Möbius.", 29.90m, 15, "figuras", "Madera", 12, 12, 8, 120, false, 2),
            P("Panel Hexagonal Modular", "panel-hexagonal-modular", "Set de 6 paneles hexagonales combinables para pared.", 42.00m, 20, "pared", "PLA", 30, 26, 2, 400, false, 1),
            P("Relieve Montañas", "relieve-montanas", "Mapa en relieve de cordillera, ideal para salón u oficina.", 54.90m, 5, "pared", "Madera", 40, 25, 3, 520, true, 2)
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Catálogo de ejemplo creado: {Categories} categorías, {Materials} materiales, {Products} productos.",
            categories.Count, materials.Count, products.Length);
    }
}
