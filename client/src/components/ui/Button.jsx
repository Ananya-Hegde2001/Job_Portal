export default function Button({ as:Comp='button', variant='primary', size='md', pill=false, className='', ...rest }) {
  const base = 'btn';
  const variantClass = {
    primary: '',
    outline: 'btn-outline',
    subtle: 'btn-subtle',
    danger: 'btn-danger'
  }[variant] || '';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const pillClass = pill ? 'btn-pill' : '';
  const cls = [base, variantClass, sizeClass, pillClass, className].filter(Boolean).join(' ');
  return <Comp className={cls} {...rest} />;
}
