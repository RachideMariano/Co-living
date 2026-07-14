import PageHead from '../components/PageHead'
import Empty from '../components/Empty'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} subtitle="Módulo ainda por migrar" />
      <Empty icon="🚧" title="Em construção" subtitle="Este módulo ainda não foi migrado do protótipo." />
    </>
  )
}
