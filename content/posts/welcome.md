
---
title: "Markdown 样例文章"
date: 2026-09-27T20:00:00+08:00
draft: false
tags: [Markdown, Hugo, PaperMod]
categories: [示例]
description: "用于测试 Hugo PaperMod 常见 Markdown 元素和右侧目录。"
showToc: true
TocOpen: true
---
这是一篇 Markdown 样例文章，用来展示 Hugo PaperMod 对常见 Markdown 语法的渲染效果。

## 一、文本与链接

这里可以使用 **粗体**、*斜体*、~~删除线~~ 和 `行内代码`。

你也可以访问 [Hugo 官方网站](https://gohugo.io/) 或 [PaperMod 项目主页](https://github.com/adityatelange/hugo-PaperMod)。

> 好的内容不只是信息的堆积，也应该有清晰的结构和舒适的阅读体验。

## 二、列表

### 无序列表

- 第一项内容
- 第二项内容
  - 二级内容
  - 另一条二级内容
- 第三项内容

### 有序列表

1. 安装 Hugo
2. 配置 PaperMod
3. 创建 Markdown 文章
4. 启动本地预览

### 任务清单

- [X] 创建 Hugo 站点
- [X] 安装 PaperMod 主题
- [X] 配置右侧目录
- [ ] 发布第一篇正式文章

## 三、表格

| 工具     | 用途         | 状态     |
| -------- | ------------ | -------- |
| Hugo     | 静态网站生成 | 已完成   |
| PaperMod | 网站主题     | 已完成   |
| Git      | 版本管理     | 推荐使用 |

## 四、代码

### PowerShell

```powershell
cd D:\1\hugo
hugo server -D
```

### Go 模板

```go
{{ range .Pages }}
  <h2>{{ .Title }}</h2>
{{ end }}
```

### JavaScript

```javascript
const message = "Hello, Hugo!";
console.log(message);
```

## 五、图片和分隔线

如果需要插入图片，可以使用下面的语法：

```markdown
![图片说明](/images/example.jpg)
```

---

## 六、结语

这篇文章可以作为后续写作的起点。你可以复制它，然后替换标题、日期、标签和正文内容。
