using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Interfaces.Repositories;
using Decoartes3D.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Decoartes3D.Infrastructure.Repositories;

public class UserRepository(AppDbContext context) : Repository<User>(context), IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        Set.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default) =>
        Set.AnyAsync(u => u.Email == email, cancellationToken);
}

public class CategoryRepository(AppDbContext context) : Repository<Category>(context), ICategoryRepository
{
    // Se incluyen los productos porque CategoryResponse expone ProductCount.
    public override Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        Set.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public override async Task<IEnumerable<Category>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Set.AsNoTracking().Include(c => c.Products).ToListAsync(cancellationToken);

    public Task<Category?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        Set.AsNoTracking().Include(c => c.Products).FirstOrDefaultAsync(c => c.Slug == slug, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, int? excludeId = null, CancellationToken cancellationToken = default) =>
        Set.AnyAsync(c => c.Slug == slug && (excludeId == null || c.Id != excludeId), cancellationToken);

    public async Task<IEnumerable<Category>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await Set.AsNoTracking()
            .Include(c => c.Products.Where(p => p.IsActive))
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);
}

public class MaterialRepository(AppDbContext context) : Repository<Material>(context), IMaterialRepository
{
    public async Task<IEnumerable<Material>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await Set.AsNoTracking()
            .Where(m => m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);
}

public class ProductRepository(AppDbContext context) : Repository<Product>(context), IProductRepository
{
    private IQueryable<Product> WithDetails => Set
        .Include(p => p.Category)
        .Include(p => p.Material)
        .Include(p => p.Images);

    public Task<Product?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        WithDetails.AsNoTracking().FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);

    public Task<Product?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default) =>
        WithDetails.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<bool> SlugExistsAsync(string slug, int? excludeId = null, CancellationToken cancellationToken = default) =>
        Set.AnyAsync(p => p.Slug == slug && (excludeId == null || p.Id != excludeId), cancellationToken);

    public async Task<(IEnumerable<Product> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? categoryId = null,
        int? materialId = null,
        string? searchTerm = null,
        bool? isActive = null,
        bool? isFeatured = null,
        CancellationToken cancellationToken = default)
    {
        var query = Set.AsNoTracking();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);
        if (materialId.HasValue)
            query = query.Where(p => p.MaterialId == materialId.Value);
        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);
        if (isFeatured.HasValue)
            query = query.Where(p => p.IsFeatured == isFeatured.Value);
        if (!string.IsNullOrWhiteSpace(searchTerm))
            query = query.Where(p =>
                p.Name.Contains(searchTerm) ||
                (p.ShortDescription != null && p.ShortDescription.Contains(searchTerm)));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(p => p.Category)
            .Include(p => p.Material)
            .OrderBy(p => p.SortOrder)
            .ThenByDescending(p => p.CreatedAt)
            .ThenBy(p => p.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IEnumerable<Product>> GetFeaturedAsync(int count, CancellationToken cancellationToken = default) =>
        await Set.AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Material)
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderBy(p => p.SortOrder)
            .ThenByDescending(p => p.CreatedAt)
            .Take(count)
            .ToListAsync(cancellationToken);
}
