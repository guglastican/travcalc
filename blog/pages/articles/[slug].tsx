interface Article {
  slug: string;
  title: string;
  content: string;
}

import { GetServerSideProps } from 'next';
import { articles } from '../../database';

export default function Article({ article }: { article: Article }) {
  return (
    <div>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const article = articles.find(a => a.slug === slug);

  if (!article) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      article,
    },
  };
};
