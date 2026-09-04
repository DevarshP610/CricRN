from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./criccoach.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    team_a = Column(String, index=True)
    team_b = Column(String, index=True)
    format = Column(String)
    overs = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store complete match summary
    summary = Column(JSON) 

    balls = relationship("Ball", back_populates="match")

class Ball(Base):
    __tablename__ = "balls"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    inning = Column(Integer)
    over_number = Column(Integer)
    ball_number = Column(Integer)
    
    bowler = Column(String)
    batsman = Column(String)
    
    speed = Column(Float)
    swing = Column(Float)
    turn = Column(Float)
    
    pitching = Column(String)
    impact = Column(String)
    wickets = Column(String)
    
    runs = Column(Integer, default=0)
    is_wicket = Column(String, default="No")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="balls")

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
