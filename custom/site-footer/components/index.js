// 自定义页脚组件 —— wjhup.com
// 文案在下面的 COPYRIGHT_TEXT 里改；链接在 quartz.config.yaml 的 options.links 里改
import { jsx } from "preact/jsx-runtime"

const COPYRIGHT_TEXT = "© 2026 wjhup.com"

const Footer = ((opts) => {
  const Footer = ({ displayClass }) => {
    const links = opts?.links ?? {}
    return jsx("footer", {
      class: displayClass ?? "",
      children: [
        jsx("p", { children: COPYRIGHT_TEXT }),
        jsx("ul", {
          children: Object.entries(links).map(([text, link]) =>
            jsx("li", {
              children: jsx("a", { href: link, children: text }),
            }),
          ),
        }),
      ],
    })
  }
  Footer.css = `footer {
  text-align: left;
  margin-bottom: 4rem;
  opacity: 0.7;
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
