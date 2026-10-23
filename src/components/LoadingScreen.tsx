export function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="loading-screen" data-testid="loading-screen">
      <div className="loader-content" role="status" aria-live="polite">
        <span className="loader-mark" aria-hidden="true"><i /><i /><i /></span>
        <p className="pixel loading-title">LOADING...</p>
        <div className="loading-meta"><span>Preparing a little perspective</span><span>{progress}%</span></div>
        <div className="progress-track" role="progressbar" aria-label="Loading critical scene assets" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
