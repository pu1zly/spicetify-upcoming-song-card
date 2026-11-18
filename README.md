# Spicetify Upcoming Song (Card Variant)

A modification of the Spicetify `upcomingSong` extension that displays the next track in the queue beside the currently playing track.

## Differences from the Original

The original extension presents the upcoming track using Spotify's standard now-playing layout elements. This variation modifies the presentation to use an alternate card-based format:

- Groups the upcoming track into an independent 213px card container placed 20px beside the current track.
- Adds an explicit "Next Up" indicator badge with Spotify green styling.
- Styles the cover image as a circular thumbnail with an accent border.
- Illuminates the card border and background on hover, displaying a floating tooltip above the card to show full track titles and featured artist credits.
- Includes a horizontal marquee scroll when track details exceed the card width.

## Installation

1. Copy `upcomingSong.js` into your Spicetify extensions directory:
   - Windows: `%userprofile%\.spicetify\Extensions\`
   - Linux / macOS: `~/.config/spicetify/Extensions/`

2. Enable the extension and apply:
   ```bash
   spicetify config extensions upcomingSong.js
   spicetify apply
   ```

## License and Attribution

- Original extension created by [Fl3xm3ist3r](https://github.com/fl3xm3ist3r).
- Released under the [MIT License](LICENSE).
