import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

export default function App() {
  const [activeCardId, setActiveCardId] = useState<any>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('LOCATING YOUR ZONE...');
  const [errorMsg, setErrorMsg] = useState('');
  const [now, setNow] = useState(new Date());

  const trackOpen = useMutation(api.cards.trackOpen);
  const revealCard = useMutation(api.cards.revealCard);

  // 1-Second live ticking clock
  useEffect(() => {
    if (isScratched) {
      const interval = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(interval);
    }
  }, [isScratched]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
      setActiveCardId(idFromUrl);
      // Type assertion added here
      trackOpen({ cardId: idFromUrl as Id<'scratchCards'> }).catch(() => {});
      setStatusMessage('TAP ANYWHERE TO REVEAL TARGET');
    } else {
      setErrorMsg('INVALID SECURE LINK.');
    }
  }, [trackOpen]);

  const handleTap = async () => {
    if (!activeCardId || isScratched || isAnimating) return;
    setIsAnimating(true);
    setStatusMessage('UNLOCKING...');

    try {
      // Type assertion added here
      const payload = await revealCard({
        cardId: activeCardId as Id<'scratchCards'>,
        userAgent: navigator.userAgent,
      });

      // Wait for the scooter to drive off screen before showing the payload
      setTimeout(() => {
        setRewardData(payload);
        setIsScratched(true);
        setIsAnimating(false);
      }, 700);
    } catch (err: any) {
      setErrorMsg('LINK EXPIRED OR ALREADY REDEEMED.');
      setIsAnimating(false);
    }
  };

  if (errorMsg) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#1a0000',
          color: '#ff4d4d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        <h2>🚫 {errorMsg}</h2>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;700&family=Rajdhani:wght@500;700&display=swap');
          body { margin: 0; padding: 0; background-color: #240000; overflow-x: hidden; }
          
          .pulse { animation: pulseAnim 1.5s infinite; }
          @keyframes pulseAnim { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
          
          /* Scooter driving off the screen */
          .drive-away { animation: driveOff 0.7s forwards cubic-bezier(0.5, 0, 0.2, 1); }
          @keyframes driveOff { 
            0% { transform: translateX(0) scale(1); opacity: 1; } 
            20% { transform: translateX(-20px) scale(1.1) rotate(-5deg); } 
            100% { transform: translateX(150vw) scale(1) rotate(10deg); opacity: 0; } 
          }

          /* Urgency Wobble for Timer */
          .wobble-alert { animation: wobble 1.5s infinite; }
          @keyframes wobble {
            0%, 100% { transform: rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: rotate(-2deg); }
            20%, 40%, 60%, 80% { transform: rotate(2deg); }
          }
          
          /* The Road Path for Milestones */
          .road-line {
            position: absolute;
            left: 22px;
            top: 30px;
            bottom: 30px;
            width: 4px;
            background: repeating-linear-gradient(to bottom, #d4af37 0, #d4af37 10px, transparent 10px, transparent 20px);
            z-index: 0;
          }
        `}
      </style>

      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: '#240000',
          backgroundImage:
            'radial-gradient(circle at top, #4a0808 0%, #110000 100%)',
          color: '#fff',
          fontFamily: "'Rajdhani', sans-serif",
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* FLIPKART MINUTES BRANDING */}
        <div
          style={{
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <div
            style={{
              background: '#f8e5a0',
              color: '#3a0202',
              fontWeight: '900',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '1.2rem',
              fontStyle: 'italic',
              fontFamily: 'sans-serif',
            }}
          >
            F
          </div>
          <h2
            style={{
              margin: 0,
              color: '#f8e5a0',
              fontSize: '1.3rem',
              fontStyle: 'italic',
              letterSpacing: '1px',
            }}
          >
            Flipkart Minutes
          </h2>
        </div>

        {/* PRE-REVEAL STATE */}
        {activeCardId && !isScratched && (
          <div
            onClick={handleTap}
            className={isAnimating ? '' : 'pulse'}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '20px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            <div
              className={isAnimating ? 'drive-away' : ''}
              style={{ fontSize: '6rem', marginBottom: '10px' }}
            >
              🛵💨
            </div>

            <div
              style={{
                transition: 'opacity 0.3s',
                opacity: isAnimating ? 0 : 1,
              }}
            >
              <h1
                style={{
                  color: '#d4af37',
                  fontSize: '2.8rem',
                  fontFamily: "'Teko', sans-serif",
                  textTransform: 'uppercase',
                  margin: 0,
                  lineHeight: '1',
                }}
              >
                YOUR EXCLUSIVE TARGET
              </h1>
              <p
                style={{
                  color: '#f9f1d8',
                  fontSize: '1.2rem',
                  letterSpacing: '2px',
                  marginTop: '15px',
                  fontWeight: 'bold',
                }}
              >
                {statusMessage}
              </p>
            </div>
          </div>
        )}

        {/* REVEALED PAYLOAD */}
        {isScratched && rewardData && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '15px',
              maxWidth: '500px',
              margin: '0 auto',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* WOBBLING LIVE TIMER */}
            <div
              className="wobble-alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 77, 77, 0.15)',
                border: '2px solid #ff4d4d',
                padding: '6px 15px',
                borderRadius: '50px',
                marginBottom: '20px',
                boxShadow: '0 4px 15px rgba(255, 77, 77, 0.3)',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#ff4d4d',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px #ff4d4d',
                  animation: 'pulseAnim 1s infinite',
                }}
              ></div>
              <span
                style={{
                  color: '#fff',
                  fontSize: '1rem',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                }}
              >
                LIVE TICKET:{' '}
                {now.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>

            {/* ZONE & ACTIVATION GRAPHIC */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '15px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(90deg, #ff4d4d, #b30000)',
                  color: '#fff',
                  padding: '4px 20px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  boxShadow: '0 2px 8px rgba(255,0,0,0.4)',
                }}
              >
                ⚡ {rewardData.shift}
              </div>

              <h2
                style={{
                  color: '#fff',
                  margin: 0,
                  fontSize: '2.5rem',
                  fontFamily: "'Teko', sans-serif",
                  letterSpacing: '1px',
                  textShadow: '0px 2px 10px rgba(0,0,0,0.8)',
                }}
              >
                {rewardData.title}
              </h2>
            </div>

            {/* EVENT HIGHLIGHT BANNER */}
            <div
              style={{
                background: 'linear-gradient(90deg, #d4af37, #f8e5a0)',
                padding: '12px 15px',
                borderRadius: '8px',
                color: '#3a0202',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  letterSpacing: '0.5px',
                }}
              >
                🔥 THE MAIN EVENT
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  background: '#3a0202',
                  color: '#d4af37',
                  padding: '4px 12px',
                  borderRadius: '6px',
                }}
              >
                {rewardData.eventDates}
              </div>
            </div>

            {/* GUARANTEED EARNINGS */}
            <div
              style={{
                backgroundColor: '#1a0000',
                border: '2px solid #d4af37',
                padding: '15px',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '25px',
              }}
            >
              <p
                style={{
                  margin: '0 0 5px 0',
                  color: '#d4af37',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                Base Event Surge
              </p>
              <p
                style={{
                  fontFamily: "'Teko', sans-serif",
                  margin: 0,
                  fontSize: '4.5rem',
                  color: '#fff',
                  lineHeight: '1',
                }}
              >
                {rewardData.earnings}
              </p>
            </div>

            {/* GAMIFIED EARNINGS ROAD */}
            <div style={{ marginBottom: '25px', padding: '0 5px' }}>
              <h3
                style={{
                  color: '#f8e5a0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 15px 0',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                }}
              >
                🗺️ Your Path to Max Earnings
              </h3>

              <div style={{ position: 'relative', paddingLeft: '10px' }}>
                <div className="road-line"></div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: '#3a0202',
                      border: '3px solid #d4af37',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      marginRight: '15px',
                    }}
                  >
                    📦
                  </div>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      padding: '10px 15px',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{ margin: 0, color: '#ccc', fontSize: '0.95rem' }}
                    >
                      Per 5 Orders Delivered
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: '#a8e6cf',
                        fontFamily: "'Teko', sans-serif",
                        fontSize: '2rem',
                        lineHeight: '1',
                      }}
                    >
                      +{rewardData.perOrderBonus}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: '#ff4d4d',
                      border: '3px solid #fff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      marginRight: '15px',
                      boxShadow: '0 0 10px #ff4d4d',
                    }}
                  >
                    🏆
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background:
                        'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.3))',
                      border: '1px solid #d4af37',
                      padding: '10px 15px',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}
                    >
                      Survive the Full Week!
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: '#d4af37',
                        fontFamily: "'Teko', sans-serif",
                        fontSize: '2.2rem',
                        lineHeight: '1',
                        textShadow: '1px 1px 0 #000',
                      }}
                    >
                      +{rewardData.continuationBonus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CRITICAL ENROLLMENT CTA */}
            <div
              style={{
                border: '2px dashed #ff4d4d',
                background: 'rgba(255, 77, 77, 0.05)',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px 0',
                  color: '#ff4d4d',
                  fontWeight: 'bold',
                  fontSize: '1.3rem',
                  letterSpacing: '1px',
                }}
              >
                ⚠️ ACTION REQUIRED
              </p>
              <p
                style={{
                  margin: 0,
                  color: '#ddd',
                  fontSize: '1.05rem',
                  lineHeight: '1.4',
                }}
              >
                Claim this offer at the earliest! Enroll yourself today at your
                nearest{' '}
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  Flipkart Minutes
                </span>{' '}
                store before this ticket expires.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
