using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Commands.MarkAlertRead;

public class MarkAlertReadCommandHandler : IRequestHandler<MarkAlertReadCommand, Result>
{
    private readonly StockDbContext _context;

    public MarkAlertReadCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(MarkAlertReadCommand request, CancellationToken cancellationToken)
    {
        var alert = await _context.StockAlerts.FirstOrDefaultAsync(a => a.Id == request.Id, cancellationToken);
        if (alert == null)
            return Result.Failure(Error.NotFound("Alert.NotFound", $"Alert with ID {request.Id} was not found."));

        alert.MarkRead();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
