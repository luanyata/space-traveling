import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>Post | Travelling</title>
      </Head>

      <div className={commonStyles.container}>
        <Header />
      </div>


      <img className={styles.bannerImage} src={post.data.banner.url} />
<div className={commonStyles.container}>


      <article className={styles.post}>
        <h1>{post.data.title}</h1>
        <div className={styles.metadata}>
          <div>
            <FiCalendar size={18} />
            <span>
              {format(new Date(post.first_publication_date), 'PP', {
                locale: ptBR,
              })}
            </span>
          </div>
          <div>
            <FiUser size={18} />
            <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock size={18} />
            <span>{`${readingTime} min`}</span>
          </div>
        </div>

        <div className={styles.postContent}>
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </div>
      </article>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
    }
  );

  const paths = postResponse.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content.map(item => ({
        heading: item.heading,
        body: [...item.body],
      })),
      banner: {
        url: response.data.banner.url,
      },
    },
    uid: response.uid,
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
