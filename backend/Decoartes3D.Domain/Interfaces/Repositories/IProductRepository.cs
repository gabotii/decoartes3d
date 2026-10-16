using Decoartes3D.Domain.Entities;

namespace Decoartes3D.Domain.Interfaces.Repositories;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<Product?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Product> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? categoryId = null,
        int? materialId = null,
        string? searchTerm = null,
        bool? isActive = null,
        bool? isFeatured = null,
        CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetFeaturedAsync(int count, CancellationToken cancellationToken = default);
}
