namespace Decoartes3D.Application.DTOs.Products;

public record ProductQueryRequest(
    int PageNumber = 1,
    int PageSize = 12,
    int? CategoryId = null,
    int? MaterialId = null,
    string? SearchTerm = null,
    bool? IsActive = null,
    bool? IsFeatured = null
);
