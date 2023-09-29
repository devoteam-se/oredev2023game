# Frontend

## Design

### App States

```mermaid
stateDiagram-v2
  [*] --> Splash

  Splash --> Game : start game

  Game --> Splash : finish game
  Game --> Splash : user input timeout

  state Game {
    [*] --> PregameEmailEntry

    PregameEmailEntry --> Rules : continue
    PregameEmailEntry --> [*] : back

    Rules --> Gameplay : start playing
    Rules --> PregameEmailEntry : back

    Gameplay  --> GameOver : finish playing
    Gameplay  --> Rules : back

    GameOver --> [*]

    state PregameEmailEntry {
      [*] --> PregameEmailForm

      PregameEmailForm --> [*] : enter name and email
      PregameEmailForm --> [*] : skip name and email entry
      PregameEmailForm --> PregamePrivacyPolicy

      PregamePrivacyPolicy --> PregameEmailForm
    }

    state GameOver {
      state if_email_is_defined <<choice>>

      [*] --> if_email_is_defined : did user provide name and email when first asked?

      if_email_is_defined --> Leaderboard : yes
      if_email_is_defined --> LeaderboardEmailEntry : no

      LeaderboardEmailEntry --> Leaderboard : enter name and email
      LeaderboardEmailEntry --> [*] : skip name and email entry
      LeaderboardEmailEntry --> LeaderboardPrivacyPolicy

      LeaderboardPrivacyPolicy --> LeaderboardEmailEntry

      Leaderboard --> [*] : done
    }
  }
```

#### Splash

- The game's "main menu".
- Should make it obvious to Øredev attendees that they're looking at a game.
- Should be legible and appealing from a distance.
- Sets the tone.

#### Game

- Reset app state back to splash screen at any time if there is no user input for _t_ seconds.
- Display a discreet but obvious message when the user input timeout will be reached in _u_ < _t_
  seconds.
- Leads back to the splash screen when user is done playing, either by finishing the game or by
  using the back button.

##### Pregame Email Entry

- Ask user for name and email address.
- Allow user to skip straight to the game.
- Clarify purpose of name and email address entry.
- Allow user to review privacy policy.

##### Rules

- Simple, bullet-point rules overview.
- Reinforces the tone.

##### Gameplay

- Main gameplay state.

##### Game Over

- Game Over screen with leaderboard.
- Leaderboard displays highest scores and most recent scores.
- Allow user to enter name and email if they haven't already done so.
- Allow user to review privacy policy before entering name and email.
- Allow user to decline entering name and email (if they don't mind not being on the leaderboard).

### Gameplay

#### States

```mermaid
stateDiagram-v2
   state if_waves_remaining <<choice>>

   [*] --> initialCountdown

   initialCountdown --> wave : after 3000 ms

   wave --> if_waves_remaining : done
   wave --> failureMessage : OVERHEATED

   if_waves_remaining --> waveCountdown : (1) if waves remain
   if_waves_remaining --> victoryMessage : (2) else

   waveCountdown --> wave

   victoryMessage --> [*] : after 3000 ms
   failureMessage --> [*] : after 3000 ms

   state wave {
      state first_char_check <<choice>>
      state char_check <<choice>>

      [*] --> noWordFocused

      noWordFocused --> first_char_check : KEYSTROKE

      first_char_check --> wordFocused : if valid first char

      wordFocused --> char_check : KEYSTROKE

      char_check --> noWordFocused : (1) if invalid char
      char_check --> wordFocused : (2) else if word incomplete
      char_check --> [*] : (3) else if wave exhausted
      char_check --> noWordFocused : (4) else
   }
```
