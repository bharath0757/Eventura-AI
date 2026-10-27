/** Reserves a full planning workspace while browser-local records hydrate. */
export function DashboardLoading() {
  return (
    <div className="container page dashboard dashboard-loading" aria-busy="true">
      <p className="sr-only" role="status">
        Opening your event plan…
      </p>
      <div aria-hidden="true">
        <div className="back-link">
          <span className="loading-line loading-short" />
        </div>
        <div className="dashboard-heading">
          <div className="loading-heading">
            <div className="heading-pills">
              <span className="loading-line loading-pill" />
              <span className="loading-line loading-pill" />
            </div>
            <div className="loading-line loading-title" />
            <div className="loading-line loading-meta" />
          </div>
          <div className="loading-line loading-completion" />
        </div>
        <div className="metric-grid">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="metric panel loading-metric">
              <span className="loading-line loading-label" />
              <span className="loading-line loading-value" />
              <span className="loading-line loading-detail" />
            </div>
          ))}
        </div>
        <div className="dashboard-nav loading-navigation">
          <span className="loading-line" />
        </div>
        <div className="dashboard-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="panel dashboard-section loading-section">
              <span className="loading-line loading-label" />
              <span className="loading-line loading-section-title" />
              <span className="loading-line loading-detail" />
              {Array.from({ length: 5 }, (_, row) => (
                <span key={row} className="loading-line loading-row" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
