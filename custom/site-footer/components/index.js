// 自定义页脚组件 —— wjhup.com
// 文案在下面的 COPYRIGHT_TEXT 里改；链接在 quartz.config.yaml 的 options.links 里改
import { jsx } from "preact/jsx-runtime"

const COPYRIGHT_TEXT = "© 2026 wjhup.com"
const DISCLAIMER_TEXT = "本站内容仅作个人学习存档，不构成任何专业建议！"

const Footer = ((opts) => {
  const Footer = ({ displayClass }) => {
    const links = opts?.links ?? {}
    const children = [
      jsx("p", { children: COPYRIGHT_TEXT }),
      jsx("p", { class: "footer-disclaimer", children: DISCLAIMER_TEXT }),
    ]
    if (Object.keys(links).length > 0) {
      children.push(
        jsx("ul", {
          children: Object.entries(links).map(([text, link]) =>
            jsx("li", {
              children: jsx("a", { href: link, children: text }),
            }),
          ),
        }),
      )
    }
    return jsx("footer", {
      class: displayClass ?? "",
      children,
    })
  }
  Footer.css = `footer {
  text-align: left;
  margin-bottom: 4rem;
  opacity: 0.7;
}
footer p.footer-disclaimer {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  opacity: 0.85;
}
footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-top: -1rem;
}`
  return Footer
})

export { Footer }
