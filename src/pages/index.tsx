import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from "react-icons/fi";
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useCallback, useState } from 'react';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);



  const handleNextPosts = useCallback(async () => {

    try {
      const response = await fetch(postsPagination.next_page);
      const { results } = await response.json();
      const newPostsArray = [...posts, ...results]
      setPosts(newPostsArray);
    } catch {
      alert('Ocorreu um erro na recuperacao dos novos posts')
    }

  }, [])

  return (
    <>
      <Head>Home | Space Trave</Head>


      <div className={commonStyles.container}>
        <Header />
      </div>

      <main className={commonStyles.container}>

        <div className={styles.posts}>
          { posts.map(post =>
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <FiCalendar size={18} />
                  <span>{format(new Date(post.first_publication_date), 'PP', {
                    locale: ptBR,
                  })}
                  </span>
                  <FiUser size={18} />
                  <span>
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          )}

          {postsPagination.next_page && (
            <button
              type="button"
              onClick={handleNextPosts}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
  };
};
