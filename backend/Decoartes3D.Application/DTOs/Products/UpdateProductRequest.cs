namespace Decoartes3D.Application.DTOs.Products;

public record UpdateProductRequest(
    string Name,
    string? Description,
    string? ShortDescription,
    decimal Price,
    int StockQuantity,
    string? MainImageUrl,
    decimal? Width,
    decimal? Height,
    decimal? Depth,
    decimal? WeightGrams,
    bool IsActive,
    bool IsFeatured,
    int SortOrder,
    int CategoryId,
    int? MaterialId
) : IProductRequest;
