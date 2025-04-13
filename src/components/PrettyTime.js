import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

const PrettyTime = ({ timestamp }) => {
  const [prettyTime, setPrettyTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setPrettyTime(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{prettyTime}</span>;
};

export default PrettyTime;