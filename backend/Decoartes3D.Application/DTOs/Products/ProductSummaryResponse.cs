namespace Decoartes3D.Application.DTOs.Products;

public record ProductSummaryResponse(
    int Id,
    string Name,
    string Slug,
    string? ShortDescription,
    decimal Price,
    int StockQuantity,
    string? MainImageUrl,
    bool IsActive,
    bool IsFeatured,
    string CategoryName,
    int CategoryId,
    string? MaterialName,
    DateTime CreatedAt
);
