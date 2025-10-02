export default function SectionCard({ title, description, actions, children }) {
  return (
    <section className="section-card">
      <div className="section-card-head">
        <div className="section-titles">
          <h3 className="section-title">{title}</h3>
          {description && <p className="section-sub">{description}</p>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      <div className="section-card-body">
        {children}
      </div>
    </section>
  );
}
