namespace Decoartes3D.Application.DTOs.Products;

/// <summary>
/// Campos comunes de alta y edición de producto; permite compartir las reglas de validación.
/// </summary>
public interface IProductRequest
{
    string Name { get; }
    string? Description { get; }
    string? ShortDescription { get; }
    decimal Price { get; }
    int StockQuantity { get; }
    string? MainImageUrl { get; }
    decimal? Width { get; }
    decimal? Height { get; }
    decimal? Depth { get; }
    decimal? WeightGrams { get; }
    int SortOrder { get; }
    int CategoryId { get; }
    int? MaterialId { get; }
}
