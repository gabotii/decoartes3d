using Decoartes3D.Domain.Entities;

namespace Decoartes3D.Domain.Interfaces.Repositories;

public interface IMaterialRepository : IRepository<Material>
{
    Task<IEnumerable<Material>> GetActiveAsync(CancellationToken cancellationToken = default);
}
