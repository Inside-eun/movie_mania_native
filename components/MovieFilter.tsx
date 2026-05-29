import { ScrollView, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  theaters: string[];
  selectedTheaters: string[];
  onToggleTheater: (theater: string) => void;
  onSelectAll: () => void;
}

export default function MovieFilter({
  theaters,
  selectedTheaters,
  onToggleTheater,
  onSelectAll,
}: Props) {
  const isAllSelected = selectedTheaters.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
    >
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onSelectAll(); }}
        className={`px-4 py-1.5 rounded-full border ${
          isAllSelected
            ? 'bg-primary border-primary'
            : 'bg-surface border-border'
        }`}
      >
        <Text
          className={`text-sm font-medium ${
            isAllSelected ? 'text-white' : 'text-gray-400'
          }`}
        >
          전체
        </Text>
      </Pressable>

      {theaters.map((theater) => {
        const isSelected = selectedTheaters.includes(theater);
        return (
          <Pressable
            key={theater}
            onPress={() => { Haptics.selectionAsync(); onToggleTheater(theater); }}
            className={`px-4 py-1.5 rounded-full border ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? 'text-white' : 'text-gray-400'
              }`}
            >
              {theater}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
