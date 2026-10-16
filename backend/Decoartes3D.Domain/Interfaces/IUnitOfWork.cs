namespace Decoartes3D.Domain.Interfaces;

/// <summary>
/// Los repositorios solo registran cambios; se persisten todos juntos con SaveChangesAsync.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
