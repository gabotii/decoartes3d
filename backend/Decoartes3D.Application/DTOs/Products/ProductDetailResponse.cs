namespace Decoartes3D.Application.DTOs.Products;

public record ProductImageDto(int Id, string Url, string? AltText, int SortOrder);

public record ProductDetailResponse(
    int Id,
    string Name,
    string Slug,
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
    string CategoryName,
    int? MaterialId,
    string? MaterialName,
    string? MaterialColorHex,
    IEnumerable<ProductImageDto> Images,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
