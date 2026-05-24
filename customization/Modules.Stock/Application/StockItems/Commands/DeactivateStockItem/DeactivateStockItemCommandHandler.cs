using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.DeactivateStockItem;

public class DeactivateStockItemCommandHandler : IRequestHandler<DeactivateStockItemCommand, Result>
{
    private readonly StockDbContext _context;

    public DeactivateStockItemCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeactivateStockItemCommand request, CancellationToken cancellationToken)
    {
        var item = await _context.StockItems.FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);
        if (item == null)
            return Result.Failure(Error.NotFound("StockItem.NotFound", $"Stock item with ID {request.Id} was not found."));

        item.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
