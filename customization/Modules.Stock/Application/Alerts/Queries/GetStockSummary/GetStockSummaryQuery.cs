using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Queries.GetStockSummary;

public record GetStockSummaryQuery() : IRequest<Result<StockSummaryDto>>;
