import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

export function LanguageSelector({ variant = 'default', showIcon = true }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setOpen(false);
  };

  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-auto px-2"
            aria-label={t('settings.selectLanguage')}
          >
            <span className="text-lg">
              {currentLanguage.flag}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="end">
          <Command>
            <CommandList>
              <CommandGroup>
                {languages.map((language) => (
                  <CommandItem
                    key={language.code}
                    value={language.code}
                    onSelect={() => handleLanguageChange(language.code)}
                    className="cursor-pointer"
                  >
                    <span className="mr-3 text-lg">{language.flag}</span>
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{language.nativeName}</span>
                      <span className="text-xs text-muted-foreground">{language.name}</span>
                    </div>
                    <Check
                      className={cn(
                        'h-4 w-4 ml-2',
                        currentLanguage.code === language.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center">
            <span className="mr-2 text-lg">{currentLanguage.flag}</span>
            <span>{currentLanguage.nativeName}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={t('settings.selectLanguage')} />
          <CommandEmpty>{t('common.search')}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.code}
                  value={language.code}
                  onSelect={() => handleLanguageChange(language.code)}
                  className="cursor-pointer"
                >
                  <span className="mr-3 text-lg">{language.flag}</span>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{language.name}</span>
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4 ml-2',
                      currentLanguage.code === language.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}