import { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Search, X } from 'lucide-react';
// 典籍语料库走子入口：manifest/节级目录轻量同步，正文载荷按书分包懒加载
import { getDocMarkdown, getDocsManifest, searchDocs, type DocMeta, type SearchHit } from 'qmdj-ts-lib/docs';
import { cn } from '@/utils/cn';

interface Props {
  onClose(): void;
  /** 初始打开的文档 path（典籍参考深链） */
  initialPath?: string;
}

/**
 * 典籍库抽屉 —— 五部书：《奇門遁甲秘笈大全》（附《金函玉鏡》残卷）、
 * 《遁甲演義》（四庫本）、《奇門遁甲統宗》、《奇门宝鉴（御定）》
 *
 * 篇目来自 qmdj-ts-lib manifest（按 book 分组，新书入库自动成组）；
 * 正文异步取（按书分包，首次打开才拉取载荷 chunk）；顶部全文检索
 * （多词 AND），命中可跳原文。经 App 以 React.lazy 懒加载。
 */
export default function CanonDrawer({ onClose, initialPath }: Props) {
  const manifest = useMemo(() => getDocsManifest(), []);
  const groups = useMemo(() => {
    const map = new Map<string, DocMeta[]>();
    for (const m of manifest) {
      const list = map.get(m.book) ?? [];
      list.push(m);
      map.set(m.book, list);
    }
    return [...map.entries()];
  }, [manifest]);

  const [activePath, setActivePath] = useState(initialPath ?? manifest[0]?.path ?? '');
  const [loaded, setLoaded] = useState<{ path: string; md: string } | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    getDocMarkdown(activePath).then((md) => {
      if (live) setLoaded({ path: activePath, md: md ?? '' });
    });
    return () => {
      live = false;
    };
  }, [activePath]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activePath]);

  const md = loaded?.path === activePath ? loaded.md : null;

  const doSearch = async () => {
    const q = query.trim();
    if (!q) {
      setHits(null);
      return;
    }
    setSearching(true);
    try {
      setHits(await searchDocs(q, { limit: 60 }));
    } finally {
      setSearching(false);
    }
  };

  const openDoc = (path: string) => {
    setActivePath(path);
    setHits(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-8" onClick={onClose}>
      <div
        className="flex h-full w-full md:h-[85vh] md:max-w-5xl md:rounded-xl overflow-hidden border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧目录 */}
        <aside className="w-44 md:w-56 shrink-0 border-r border-border/60 flex flex-col bg-card/40">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60">
            <BookOpen size={14} className="text-[var(--color-gold)] shrink-0" />
            <span className="text-sm font-semibold text-[var(--color-gold-light)]">典籍库</span>
          </div>
          {/* 检索框 */}
          <div className="p-2 border-b border-border/40">
            <div className="flex items-center gap-1 rounded-md border border-input bg-secondary px-2">
              <Search size={12} className="text-muted-foreground shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder="全文检索…"
                className="w-full bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground/60"
              />
              {query && (
                <button onClick={() => { setQuery(''); setHits(null); }} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {groups.map(([book, list]) => (
              <div key={book}>
                <p className="px-1 pb-1 text-[10px] text-muted-foreground/70">{book}</p>
                <ul className="space-y-0.5">
                  {list.map((m) => (
                    <li key={m.path}>
                      <button
                        onClick={() => openDoc(m.path)}
                        className={cn(
                          'w-full rounded px-2 py-1 text-left text-xs leading-5 transition-colors',
                          m.path === activePath && !hits
                            ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold-light)]'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}
                        title={m.title}
                      >
                        <span className="block truncate">{m.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* 右侧内容 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="truncate text-sm text-muted-foreground">
              {hits ? `检索「${query.trim()}」：${hits.length} 处命中` : manifest.find((m) => m.path === activePath)?.title}
            </span>
            <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground" title="关闭">
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {hits ? (
              searching ? (
                <p className="text-sm text-muted-foreground">检索中…</p>
              ) : hits.length === 0 ? (
                <p className="text-sm text-muted-foreground">无命中；转录为简体，可尝试简体词或同义写法（如「青龙返首/青龙反首」）。</p>
              ) : (
                <ul className="space-y-2">
                  {hits.map((h, i) => (
                    <li key={i}>
                      <button
                        onClick={() => openDoc(h.docPath)}
                        className="w-full rounded-lg border border-border/50 bg-card/50 px-3 py-2 text-left hover:border-[var(--color-gold)]/40 transition-colors"
                      >
                        <p className="text-[11px] text-[var(--color-gold)]/80">
                          {h.docTitle}
                          {h.section ? ` · ${h.section}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-foreground/90 line-clamp-3">{h.text}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : md === null ? (
              <p className="text-sm text-muted-foreground">载入书卷中…</p>
            ) : (
              <article className="canon-prose">
                <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
