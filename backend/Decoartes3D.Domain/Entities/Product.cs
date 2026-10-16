namespace Decoartes3D.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ShortDescription { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; } = 0;
    public string? MainImageUrl { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Depth { get; set; }
    public decimal? WeightGrams { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public int SortOrder { get; set; } = 0;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public int? MaterialId { get; set; }
    public Material? Material { get; set; }

    public ICollection<ProductImage> Images { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
