using System;
using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Modules.Stock.Controllers;

public class AlertSettings
{
    public int ExpiryWarningDays { get; set; } = 30;
}

public interface IAlertSettingsService
{
    AlertSettings GetSettings();
    void SaveSettings(AlertSettings settings);
}

public class AlertSettingsService : IAlertSettingsService
{
    private readonly string _filePath;
    private readonly object _lock = new();
    private AlertSettings _cachedSettings;

    public AlertSettingsService()
    {
        var basePath = AppContext.BaseDirectory;
        _filePath = Path.Combine(basePath, "alert_settings.json");
        _cachedSettings = LoadFromFile();
    }

    private AlertSettings LoadFromFile()
    {
        lock (_lock)
        {
            if (!File.Exists(_filePath))
            {
                var defaultSettings = new AlertSettings();
                var json = JsonSerializer.Serialize(defaultSettings);
                File.WriteAllText(_filePath, json);
                return defaultSettings;
            }

            try
            {
                var json = File.ReadAllText(_filePath);
                return JsonSerializer.Deserialize<AlertSettings>(json) ?? new AlertSettings();
            }
            catch
            {
                return new AlertSettings();
            }
        }
    }

    public AlertSettings GetSettings()
    {
        return _cachedSettings;
    }

    public void SaveSettings(AlertSettings settings)
    {
        lock (_lock)
        {
            _cachedSettings = settings;
            var json = JsonSerializer.Serialize(settings);
            File.WriteAllText(_filePath, json);
        }
    }
}

[ApiController]
[Route("api/stock/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly IAlertSettingsService _settingsService;

    public SettingsController(IAlertSettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet("alerts")]
    public IActionResult GetAlertSettings()
    {
        return Ok(_settingsService.GetSettings());
    }

    [HttpPut("alerts")]
    public IActionResult UpdateAlertSettings([FromBody] AlertSettings settings)
    {
        if (settings == null || settings.ExpiryWarningDays <= 0)
        {
            return BadRequest("Invalid settings value");
        }

        _settingsService.SaveSettings(settings);
        return Ok(_settingsService.GetSettings());
    }
}
