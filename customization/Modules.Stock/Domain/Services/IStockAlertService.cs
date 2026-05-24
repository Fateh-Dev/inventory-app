using System.Threading;
using System.Threading.Tasks;
using Modules.Stock.Domain.Entities;

namespace Modules.Stock.Domain.Services;

public interface IStockAlertService
{
    Task CheckAndCreateAlertsAsync(StockItem item, CancellationToken ct = default);
}
