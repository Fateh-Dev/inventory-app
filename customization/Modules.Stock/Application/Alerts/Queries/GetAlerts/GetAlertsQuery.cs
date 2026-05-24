using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Queries.GetAlerts;

public record GetAlertsQuery(
    bool? UnreadOnly = null,
    bool? UnresolvedOnly = null,
    Guid? StockItemId = null
) : IRequest<Result<IEnumerable<StockAlertDto>>>;
