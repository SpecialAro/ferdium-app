import { useEffect, useState } from 'react';
import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Pagination,
  PaginationItem,
  Typography,
} from '@mui/material';
import { ITheme } from '../../../models/Theme';

interface IProps {
  themes: ITheme[];
  searchTerm: string;
}

export default function MediaP(props: IProps) {
  const { themes: initThemes, searchTerm } = props;

  if (!initThemes || initThemes.length === 0) {
    return null;
  }

  let themes = initThemes;

  if (searchTerm) {
    themes = initThemes.filter(theme => {
      return theme.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  const itemsPerPage = 6;
  const pageCount = Math.ceil(themes.length / itemsPerPage);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);
  };

  const start = (page - 1) * itemsPerPage;

  const end = start + itemsPerPage;

  const currentThemes = themes.slice(start, end);

  // const isSelected = (theme: ITheme) => {
  //   if (theme.id === 6) {
  //     console.log('selected', theme.id);
  //     return true;
  //   }

  //   return false;
  // };

  return (
    <>
      <Pagination
        count={pageCount}
        page={page}
        onChange={handlePageChange}
        color="primary"
        sx={{
          '& > .MuiPagination-ul': {
            justifyContent: 'center',
          },
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          height: 'min-content',
          justifyContent: 'center',
        }}
      >
        {currentThemes.map(theme => {
          return (
            <Card
              key={theme.id}
              sx={{
                margin: '1rem',
                display: 'block',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <CardHeader
                title={theme.name}
                subheader={theme.version}
                sx={{ height: 'min-content' }}
              />
              <CardMedia
                component="img"
                height="100"
                src={theme.preview ?? 'https://via.placeholder.com/150'}
                alt={theme.name}
              />
              <CardActions>
                <button>Install</button>
                <button>Preview</button>
              </CardActions>
              {/* <CardContent>
              <h3>{theme.name}</h3>
            </CardContent> */}
              {/* <img
              src={theme.preview ?? 'https://via.placeholder.com/150'}
              alt={theme.name}
              style={{ width: '100%', height: 'auto' }}
            />
            <div>
              <h3>{theme.name}</h3>
              <p>{theme.description}</p>
            </div> */}
            </Card>
          );
        })}
      </div>
    </>
  );
}
