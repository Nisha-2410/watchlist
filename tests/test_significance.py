import unittest
from backend.significance import Signals, classify, confidence


class SignificanceTests(unittest.TestCase):
    def test_normal_below_primary_thresholds(self):
        self.assertEqual(classify(Signals(absolute_move=2.9, volume_ratio=1.9)), "Normal")

    def test_notable_at_move_boundary(self):
        self.assertEqual(classify(Signals(absolute_move=3)), "Notable")

    def test_notable_at_volume_boundary(self):
        self.assertEqual(classify(Signals(absolute_move=0.5, volume_ratio=2)), "Notable")

    def test_significant_at_high_move_boundary(self):
        self.assertEqual(classify(Signals(absolute_move=-6)), "Significant")

    def test_notable_with_evidence_is_significant(self):
        self.assertEqual(classify(Signals(absolute_move=3, event_match=True)), "Significant")

    def test_stale_data_caps_high_confidence(self):
        self.assertEqual(confidence(Signals(absolute_move=4, volume_ratio=2.4, stale=True)), "Medium")

    def test_one_signal_is_low_confidence(self):
        self.assertEqual(confidence(Signals(absolute_move=4)), "Low")
