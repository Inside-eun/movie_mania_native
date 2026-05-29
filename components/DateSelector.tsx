import { useRef, useEffect, useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ITEM_WIDTH = 52;
const ITEM_MARGIN = 6;

function buildDates(): { dateStr: string; day: string; num: number; isToday: boolean }[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateStr: `${y}-${m}-${day}`,
      day: DAYS[d.getDay()],
      num: d.getDate(),
      isToday: i === 0,
    };
  });
}

const DATES = buildDates();

export default function DateSelector({ selectedDate, onSelectDate }: Props) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const idx = DATES.findIndex((d) => d.dateStr === selectedDate);
    if (idx > 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [selectedDate]);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_WIDTH + ITEM_MARGIN * 2,
      offset: (ITEM_WIDTH + ITEM_MARGIN * 2) * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      ref={listRef}
      data={DATES}
      keyExtractor={(item) => item.dateStr}
      horizontal
      showsHorizontalScrollIndicator={false}
      getItemLayout={getItemLayout}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
      renderItem={({ item }) => {
        const isSelected = item.dateStr === selectedDate;
        return (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onSelectDate(item.dateStr);
            }}
            style={{ width: ITEM_WIDTH, marginHorizontal: ITEM_MARGIN }}
            className={`items-center py-2 rounded-xl ${
              isSelected ? 'bg-primary' : 'bg-surface'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isSelected ? 'text-white' : item.day === '일' ? 'text-red-400' : item.day === '토' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              {item.isToday ? '오늘' : item.day}
            </Text>
            <Text
              className={`text-base font-bold mt-0.5 ${
                isSelected ? 'text-white' : 'text-white'
              }`}
            >
              {item.num}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}
