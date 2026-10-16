using System.Security.Cryptography;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Enums;
using Decoartes3D.Domain.Interfaces.Repositories;
using Decoartes3D.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Decoartes3D.Infrastructure.Repositories;

public class OrderRepository(AppDbContext context) : Repository<Order>(context), IOrderRepository
{
    // Sin 0/O ni 1/I para que el número se pueda dictar por teléfono sin confusiones.
    private const string OrderNumberAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const int OrderNumberSuffixLength = 6;

    private IQueryable<Order> WithDetails => Set
        .Include(o => o.User)
        .Include(o => o.Items).ThenInclude(i => i.Product);

    public Task<Order?> GetByOrderNumberAsync(string orderNumber, CancellationToken cancellationToken = default) =>
        WithDetails.AsNoTracking().FirstOrDefaultAsync(o => o.OrderNumber == orderNumber, cancellationToken);

    public Task<Order?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default) =>
        WithDetails.FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public async Task<(IEnumerable<Order> Items, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        int? userId = null,
        OrderStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = Set.AsNoTracking();

        if (userId.HasValue)
            query = query.Where(o => o.UserId == userId.Value);
        if (status.HasValue)
            query = query.Where(o => o.Status == status.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(o => o.User)
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ThenByDescending(o => o.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IEnumerable<Order>> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default) =>
        await Set.AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

    /// <summary>
    /// Formato DA-AAMMDD-XXXXXX, p. ej. DA-260926-7KQ4ZP.
    /// </summary>
    public async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken = default)
    {
        var prefix = $"DA-{DateTime.UtcNow:yyMMdd}-";
        string orderNumber;
        do
        {
            orderNumber = prefix + RandomNumberGenerator.GetString(OrderNumberAlphabet, OrderNumberSuffixLength);
        }
        while (await Set.AnyAsync(o => o.OrderNumber == orderNumber, cancellationToken));

        return orderNumber;
    }
}
