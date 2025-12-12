import React, { useState, useEffect } from 'react';
import CoordinatorLayout from '../../components/Layout/CoordinatorLayout';
import { analyticsApi, ChartType, AnalyticsReportRequest } from '../../api/analytics';
import '../UserEditPage.css';
import './AnalyticsPage.css';

const AnalyticsPage: React.FC = () => {
  const [previewChartType, setPreviewChartType] = useState<ChartType>('status_distribution');
  const [fromDate, setFromDate] = useState<string>(() => {
    // По умолчанию - месяц назад
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    // По умолчанию - сегодня
    return new Date().toISOString().split('T')[0];
  });

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [reportCharts, setReportCharts] = useState<ChartType[]>(['status_distribution', 'failure_frequency', 'inspector_performance']);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Очистка URL изображения при размонтировании
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  const chartLabels: Record<ChartType, string> = {
    status_distribution: 'Распределение статусов заданий по районам',
    failure_frequency: 'Частота проблемных состояний по элементам',
    inspector_performance: 'Производительность инспекторов',
  };

  const handlePreviewChart = async () => {
    if (!fromDate || !toDate) {
      setPreviewError('Укажите период для отображения графика');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setPreviewError('Дата начала не может быть позже даты окончания');
      return;
    }

    try {
      setLoadingPreview(true);
      setPreviewError(null);
      
      const blob = await analyticsApi.previewChart(previewChartType, fromDate, toDate);
      
      // Создаем URL для отображения изображения
      const url = URL.createObjectURL(blob);
      setPreviewImageUrl(url);
    } catch (err: any) {
      setPreviewError(err.response?.data?.error || 'Ошибка генерации графика');
      setPreviewImageUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!fromDate || !toDate) {
      setReportError('Укажите период для генерации отчета');
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setReportError('Дата начала не может быть позже даты окончания');
      return;
    }

    if (reportCharts.length === 0) {
      setReportError('Выберите хотя бы один график для включения в отчет');
      return;
    }

    try {
      setGeneratingReport(true);
      setReportError(null);

      const request: AnalyticsReportRequest = {
        from: fromDate,
        to: toDate,
        charts: reportCharts,
      };

      const blob = await analyticsApi.generateReport(request);

      // Создаем ссылку для скачивания файла
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${fromDate}_${toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setReportError(err.response?.data?.error || 'Ошибка генерации отчета');
    } finally {
      setGeneratingReport(false);
    }
  };

  const toggleReportChart = (chart: ChartType) => {
    setReportCharts(prev =>
      prev.includes(chart)
        ? prev.filter(c => c !== chart)
        : [...prev, chart]
    );
  };

  return (
    <CoordinatorLayout>
      <div className="analytics-page">
        <div className="page-header">
          <h1 className="page-title">Аналитика</h1>
        </div>

        <div className="analytics-sections">
          {/* Секция предпросмотра графиков */}
          <section className="analytics-section">
            <h2>Предпросмотр графиков</h2>
            <p className="section-description">
              Выберите тип графика и период для предпросмотра. График отобразится на странице.
            </p>

            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="previewChartType">Тип графика</label>
                  <select
                    id="previewChartType"
                    className="form-input"
                    value={previewChartType}
                    onChange={(e) => setPreviewChartType(e.target.value as ChartType)}
                    disabled={loadingPreview}
                  >
                    {Object.entries(chartLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="fromDate">Дата начала</label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    disabled={loadingPreview}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="toDate">Дата окончания</label>
                  <input
                    type="date"
                    id="toDate"
                    className="form-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    disabled={loadingPreview}
                  />
                </div>

                <button
                  className="btn-submit"
                  onClick={handlePreviewChart}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? 'Генерация...' : 'Показать график'}
                </button>
              </div>
            </div>

            {previewError && <div className="error-message">{previewError}</div>}

            {previewImageUrl && (
              <div className="chart-preview">
                <h3>{chartLabels[previewChartType]}</h3>
                <img src={previewImageUrl} alt="Chart preview" className="chart-image" />
              </div>
            )}
          </section>

          {/* Секция генерации PDF отчета */}
          <section className="analytics-section">
            <h2>Генерация PDF отчета</h2>
            <p className="section-description">
              Выберите графики для включения в отчет и период. Отчет будет автоматически скачан после генерации.
            </p>

            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label>Графики для включения в отчет</label>
                  <div className="checkbox-group">
                    {Object.entries(chartLabels).map(([value, label]) => (
                      <label key={value} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={reportCharts.includes(value as ChartType)}
                          onChange={() => toggleReportChart(value as ChartType)}
                          disabled={generatingReport}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reportFromDate">Дата начала</label>
                  <input
                    type="date"
                    id="reportFromDate"
                    className="form-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    disabled={generatingReport}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reportToDate">Дата окончания</label>
                  <input
                    type="date"
                    id="reportToDate"
                    className="form-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    disabled={generatingReport}
                  />
                </div>

                <button
                  className="btn-submit"
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                >
                  {generatingReport ? 'Генерация отчета...' : 'Сгенерировать PDF отчет'}
                </button>
              </div>
            </div>

            {reportError && <div className="error-message">{reportError}</div>}
          </section>
        </div>
      </div>
    </CoordinatorLayout>
  );
};

export default AnalyticsPage;

