import { useForm } from 'react-hook-form';
import { useCreateItem } from '../api/queries';
import { useUserStore } from '../store/userStore';

const ItemCreateForm = () => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: { attention: 0.8, interest: 0.5, difficulty: 0.5 },
  });
  const createItem = useCreateItem();
  const { baseMemory, sleepQuality, memoryFloor } = useUserStore();

  const onSubmit = async (data) => {
    await createItem.mutateAsync({
      topic: data.topic,
      content: data.content,
      attention: data.attention,
      interest: data.interest,
      difficulty: data.difficulty,
      base_memory: baseMemory,
      sleep_quality: sleepQuality,
      memory_floor: memoryFloor,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('topic')} placeholder='Topic' />
      <label>
        Attention (0=distracted, 1=focused): {watch('attention')}
        <input type='range' min='0' max='1' step='0.1' {...register('attention')} />
      </label>
      {/* Similar for interest, difficulty */}
      <button type='submit'>Create</button>
    </form>
  );
};