import { Link } from 'react-router-dom'
import './StaticInfoPage.css'

export function StaticInfoPage({ title }) {
  return (
    <div className="appFrame appFrame--promo">
      <div className="appMain">
        <header className="appTopbar appTopbar--flat">
          <div className="appTopbar__shell">
            <div className="appTopbar__left">
              <Link className="appBrand appBrand--button appBrand--header" to="/">
                <span className="appWordmark">
                  <span className="appWordmark__near">NEAR</span>
                  <span className="appWordmark__by">.by</span>
                </span>
              </Link>
            </div>
          </div>
        </header>

        <div className="appContent appContent--promo">
          <section className="staticDocPage" aria-labelledby="static-doc-title">
            <h1 id="static-doc-title" className="staticDocPage__title">
              {title}
            </h1>
            <p className="staticDocPage__lead">Текст раздела будет добавлен позже.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
