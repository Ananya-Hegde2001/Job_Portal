export default function Container({ children, className='' }) {
  return <div className={[ 'layout', className ].filter(Boolean).join(' ')}>{children}</div>;
}
