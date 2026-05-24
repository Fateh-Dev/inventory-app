using System;
using System.Collections.Generic;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Events;
using Modules.Stock.Domain.ValueObjects;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class StockMovement : AggregateRoot
{
    public string MovementNumber { get; private set; }
    public StockMovementType Type { get; private set; }
    public StockMovementStatus Status { get; private set; }
    public Guid? SourceWarehouseId { get; private set; }
    public Guid? DestinationWarehouseId { get; private set; }
    public Guid? SupplierId { get; private set; }
    public Guid? DepartmentId { get; private set; }
    public string? Reference { get; private set; }
    public DateTime MovementDate { get; private set; }
    public string? Notes { get; private set; }
    public string CreatedByUser { get; private set; }

    private readonly List<StockMovementLine> _lines = new();
    public IReadOnlyCollection<StockMovementLine> Lines => _lines.AsReadOnly();

    private StockMovement() { }

    private StockMovement(string movementNumber, StockMovementType type, Guid? sourceWarehouseId, Guid? destinationWarehouseId, Guid? supplierId, Guid? departmentId, DateTime date, string createdBy, string? reference, string? notes)
    {
        Id = Guid.NewGuid();
        MovementNumber = movementNumber;
        Type = type;
        Status = StockMovementStatus.Pending;
        SourceWarehouseId = sourceWarehouseId;
        DestinationWarehouseId = destinationWarehouseId;
        SupplierId = supplierId;
        DepartmentId = departmentId;
        MovementDate = date;
        CreatedByUser = createdBy;
        Reference = reference;
        Notes = notes;

        Raise(new StockMovementCreatedDomainEvent(Id, MovementNumber, Type, DateTime.UtcNow));
    }

    public static StockMovement CreateReception(string movementNumber, Guid warehouseId, Guid supplierId, DateTime date, string createdBy, string? reference, string? notes)
    {
        return new StockMovement(movementNumber, StockMovementType.Reception, null, warehouseId, supplierId, null, date, createdBy, reference, notes);
    }

    public static StockMovement CreateIssue(string movementNumber, Guid warehouseId, Guid departmentId, DateTime date, string createdBy, string? reference, string? notes)
    {
        return new StockMovement(movementNumber, StockMovementType.Issue, warehouseId, null, null, departmentId, date, createdBy, reference, notes);
    }

    public static StockMovement CreateTransfer(string movementNumber, Guid sourceId, Guid destId, DateTime date, string createdBy, string? notes)
    {
        return new StockMovement(movementNumber, StockMovementType.Transfer, sourceId, destId, null, null, date, createdBy, null, notes);
    }

    public static StockMovement CreateReturn(string movementNumber, Guid warehouseId, Guid departmentId, DateTime date, string createdBy, string? reference, string? notes)
    {
        return new StockMovement(movementNumber, StockMovementType.Return, null, warehouseId, null, departmentId, date, createdBy, reference, notes);
    }

    public static StockMovement CreateAdjustment(string movementNumber, Guid warehouseId, DateTime date, string createdBy, string? notes)
    {
        return new StockMovement(movementNumber, StockMovementType.Adjustment, warehouseId, null, null, null, date, createdBy, null, notes);
    }

    public void AddLine(Guid stockItemId, Guid stockLotId, Quantity qty, MoneyAmount unitCost, string? notes)
    {
        var line = new StockMovementLine(Id, stockItemId, stockLotId, qty, unitCost, notes);
        _lines.Add(line);
    }

    public void Confirm()
    {
        if (_lines.Count == 0)
            throw new InvalidOperationException("Cannot confirm a movement with no lines");

        Status = StockMovementStatus.Confirmed;
        Raise(new StockMovementConfirmedDomainEvent(Id, MovementNumber, Type, DateTime.UtcNow));
    }

    public void Cancel()
    {
        Status = StockMovementStatus.Cancelled;
        Raise(new StockMovementCancelledDomainEvent(Id, MovementNumber, DateTime.UtcNow));
    }
}
