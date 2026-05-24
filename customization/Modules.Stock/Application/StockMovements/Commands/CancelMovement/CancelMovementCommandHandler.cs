using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.CancelMovement;

public class CancelMovementCommandHandler : IRequestHandler<CancelMovementCommand, Result>
{
    private readonly StockDbContext _context;

    public CancelMovementCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CancelMovementCommand request, CancellationToken cancellationToken)
    {
        var movement = await _context.StockMovements.FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        
        if (movement == null)
            return Result.Failure(Error.NotFound("Movement.NotFound", $"Movement with ID {request.Id} was not found."));

        if (movement.Status != StockMovementStatus.Pending)
            return Result.Failure(Error.Conflict("Movement.NotPending", "Only pending movements can be cancelled."));

        movement.Cancel();
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
